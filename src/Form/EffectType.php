<?php

namespace App\Form;

use App\Entity\Effect;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class EffectType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('description', TextType::class)
            ->add('is_positive', ChoiceType::class, [
                    'choices' => [
                        'yes' => true,
                        'no' => false,
                    ]])
            ->add('note', TextareaType::class)
            ->add('dimension', ChoiceType::class, [
                    'choices' => [
                        'environmental' => 'env',
                        'economic' => 'eco',
                        'social' => 'soc',
                        'individual' => 'ind',
                        'technical' => 'tec',
                    ]])
            ->add('order_of_effect', ChoiceType::class, [
                    'choices' => [
                        'direct' => '1',
                        'indirect' => '2',
                        'systemic' => '3',
                    ]])
            ->add('causes')
            ->add('consequences')
        ;
    }

    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => Effect::class,
        ]);
    }
}
