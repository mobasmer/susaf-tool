<?php

namespace App\Repository;

use App\Entity\Effect;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Common\Persistence\ManagerRegistry;

/**
 * @method Effect|null find($id, $lockMode = null, $lockVersion = null)
 * @method Effect|null findOneBy(array $criteria, array $orderBy = null)
 * @method Effect[]    findAll()
 * @method Effect[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class EffectRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Effect::class);
    }

    // /**
    //  * @return Effect[] Returns an array of Effect objects
    //  */
    /*
    public function findByExampleField($value)
    {
        return $this->createQueryBuilder('e')
            ->andWhere('e.exampleField = :val')
            ->setParameter('val', $value)
            ->orderBy('e.id', 'ASC')
            ->setMaxResults(10)
            ->getQuery()
            ->getResult()
        ;
    }
    */

    /*
    public function findOneBySomeField($value): ?Effect
    {
        return $this->createQueryBuilder('e')
            ->andWhere('e.exampleField = :val')
            ->setParameter('val', $value)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
    */

    public function getNumberOfLinks(int $userId): int {
        $effects = $this->findBy(
            ['creator' => $userId]
        );

        $sum = 0;

        foreach($effects as $effect) {
            $consequences = $effect->getConsequences();

            $sum += count($consequences);
        }

        return $sum;
    }

    public function getMostCommonDimension(int $userId): string {
        $entityManager = $this->getEntityManager();

        $query = $entityManager->createQuery(
            'SELECT e.dimension, COUNT(e)
                    FROM App\Entity\Effect e JOIN e.creator c
                    WHERE c.id = :userId
                    GROUP BY e.dimension')
        ->setParameter('userId', $userId);

        $result = $query->getResult();

        return $this->dimensionWithMax($result);
    }

    private function dimensionWithMax($table) : string {

        if(empty($table)){
            return "N/A";
        }

        $maxDimension =  $table[0]['dimension'];
        $max = $table[0][1];

        foreach($table as $dim){
            if($max < $dim[1]){
                $maxDimension =  $dim['dimension'];
                $max = $dim[1];
            }
        }

        return $maxDimension;
    }
}


